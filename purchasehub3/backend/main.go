package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

type User struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	Token    string `json:"token"`
}

type Order struct {
	ID                 int    `json:"id"`
	RequesterName      string `json:"requester_name"`
	ProjectName        string `json:"project_name"`
	CompanyName        string `json:"company_name"`
	ProductName        string `json:"product_name"`
	ProductURL         string `json:"product_url"`
	ProductDescription string `json:"product_description"`
	Quantity           int    `json:"quantity"`
	OrderDate          string `json:"order_date"`
	NeededByDate       string `json:"needed_by_date"`
	DeliveryDate       string `json:"delivery_date"`
	TrackingURL        string `json:"tracking_url"`
	OrderStatus        string `json:"order_status"`
	PaymentStatus      string `json:"payment_status"`
	Notes              string `json:"notes"`
	InvoiceFilename    string `json:"invoice_filename"`
	InvoiceData        string `json:"invoice_data"`
	Archived           bool   `json:"archived"`
}

// hardcoded users
var users = map[string]struct {
	Password string
	Role     string
}{
	"Employee": {"Employee@123", "employee"},
	"Admin":    {"Admin$2026", "admin"},
}

// tokenSecret signs stateless tokens. Set APP_SECRET in the environment so
// tokens survive restarts/redeploys; the fallback is only for local dev.
var tokenSecret = func() []byte {
	if s := os.Getenv("APP_SECRET"); s != "" {
		return []byte(s)
	}
	return []byte("dev-insecure-secret-change-me")
}()

// signToken builds a stateless token of the form base64(username|role).signature.
// There is no server-side session store, so a restart can't invalidate it.
func signToken(username, role string) string {
	payload := base64.RawURLEncoding.EncodeToString([]byte(username + "|" + role))
	mac := hmac.New(sha256.New, tokenSecret)
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return payload + "." + sig
}

// verifyToken validates the signature and returns the embedded user.
func verifyToken(token string) (User, bool) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return User{}, false
	}
	payload, sig := parts[0], parts[1]
	mac := hmac.New(sha256.New, tokenSecret)
	mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return User{}, false
	}
	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return User{}, false
	}
	fields := strings.SplitN(string(raw), "|", 2)
	if len(fields) != 2 {
		return User{}, false
	}
	return User{Username: fields[0], Role: fields[1], Token: token}, true
}

func cors(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return true
	}
	return false
}

func getSession(r *http.Request) (User, bool) {
	token := r.Header.Get("Authorization")
	return verifyToken(token)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if cors(w, r) {
		return
	}
	var creds struct{ Username, Password string }
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	u, ok := users[creds.Username]
	if !ok || u.Password != creds.Password {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username or password"})
		return
	}
	token := signToken(creds.Username, u.Role)
	session := User{Username: creds.Username, Role: u.Role, Token: token}
	json.NewEncoder(w).Encode(session)
}

func ordersHandler(w http.ResponseWriter, r *http.Request) {
	if cors(w, r) {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	user, ok := getSession(r)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	log.Printf("ordersHandler %s %s user=%s role=%s", r.Method, r.URL.String(), user.Username, user.Role)

	switch r.Method {
	case "GET":
		rows, err := db.Query(`SELECT id, requester_name, project_name, company_name, product_name, product_url, product_description, quantity,
			to_char(order_date,'DD/MM/YYYY'), COALESCE(to_char(needed_by_date,'DD/MM/YYYY'), ''), COALESCE(to_char(delivery_date,'DD/MM/YYYY'), ''), tracking_url, order_status, payment_status, notes,
			invoice_filename, invoice_data, archived
			FROM orders ORDER BY order_date DESC, id DESC`)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()
		var list []Order
		for rows.Next() {
			var o Order
			if err := rows.Scan(&o.ID, &o.RequesterName, &o.ProjectName, &o.CompanyName, &o.ProductName, &o.ProductURL, &o.ProductDescription, &o.Quantity,
				&o.OrderDate, &o.NeededByDate, &o.DeliveryDate, &o.TrackingURL, &o.OrderStatus, &o.PaymentStatus, &o.Notes,
				&o.InvoiceFilename, &o.InvoiceData, &o.Archived); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			list = append(list, o)
		}
		if list == nil {
			list = []Order{}
		}
		json.NewEncoder(w).Encode(list)

	case "POST":
		var o Order
		if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		o.RequesterName = strings.TrimSpace(o.RequesterName)
		o.ProjectName = strings.TrimSpace(o.ProjectName)
		o.CompanyName = strings.TrimSpace(o.CompanyName)
		o.ProductName = strings.TrimSpace(o.ProductName)
		o.ProductURL = strings.TrimSpace(o.ProductURL)
		if o.Quantity < 1 {
			o.Quantity = 1
		}
		if o.RequesterName == "" || o.ProductName == "" || o.CompanyName == "" || o.ProductURL == "" {
			http.Error(w, "requester_name, product_name, company_name, and product_url are required", http.StatusBadRequest)
			return
		}
		if _, err := url.ParseRequestURI(o.ProductURL); err != nil {
			http.Error(w, "product_url must be a valid URL", http.StatusBadRequest)
			return
		}
		var neededBy interface{}
		if o.NeededByDate != "" {
			neededBy = parseDMY(o.NeededByDate)
			if neededBy == nil {
				http.Error(w, "invalid needed_by_date format, expected DD/MM/YYYY", http.StatusBadRequest)
				return
			}
		}
		var id int
		err := db.QueryRow(`INSERT INTO orders
			(requester_name, project_name, company_name, product_name, product_url, product_description, quantity, needed_by_date, order_status, payment_status, notes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending','Unpaid','') RETURNING id`,
			o.RequesterName, o.ProjectName, o.CompanyName, o.ProductName, o.ProductURL, o.ProductDescription, o.Quantity, neededBy).Scan(&id)
		if err != nil {
			log.Printf("create order failed: %v payload=%+v", err, o)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": id})

	case "PUT":
		action := r.URL.Query().Get("action")
		if action == "restore" {
			if user.Role != "admin" {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			idStr := r.URL.Query().Get("id")
			id, _ := strconv.Atoi(idStr)
			_, err := db.Exec(`UPDATE orders SET archived=FALSE WHERE id=$1`, id)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			json.NewEncoder(w).Encode(map[string]bool{"success": true})
			return
		}

		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
		var body struct {
			RequesterName      *string `json:"requester_name"`
			ProjectName        *string `json:"project_name"`
			CompanyName        *string `json:"company_name"`
			ProductName        *string `json:"product_name"`
			ProductURL         *string `json:"product_url"`
			ProductDescription *string `json:"product_description"`
			Quantity           *int    `json:"quantity"`
			NeededByDate       *string `json:"needed_by_date"`
			TrackingURL        *string `json:"tracking_url"`
			OrderStatus        *string `json:"order_status"`
			PaymentStatus      *string `json:"payment_status"`
			DeliveryDate       *string `json:"delivery_date"`
			Notes              *string `json:"notes"`
			InvoiceFilename    *string `json:"invoice_filename"`
			InvoiceData        *string `json:"invoice_data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if user.Role != "admin" {
			if body.RequesterName != nil {
				_, err := db.Exec(`UPDATE orders SET requester_name=$1 WHERE id=$2`, *body.RequesterName, id)
				if err != nil { http.Error(w, err.Error(), 500); return }
			}
			if body.ProjectName != nil {
				_, err := db.Exec(`UPDATE orders SET project_name=$1 WHERE id=$2`, *body.ProjectName, id)
				if err != nil { http.Error(w, err.Error(), 500); return }
			}
			if body.ProductName != nil {
				_, err := db.Exec(`UPDATE orders SET product_name=$1 WHERE id=$2`, *body.ProductName, id)
				if err != nil { http.Error(w, err.Error(), 500); return }
			}
			if body.TrackingURL != nil {
				_, err := db.Exec(`UPDATE orders SET tracking_url=$1 WHERE id=$2`, *body.TrackingURL, id)
				if err != nil { http.Error(w, err.Error(), 500); return }
			}
			if body.ProductDescription != nil {
				_, err := db.Exec(`UPDATE orders SET product_description=$1 WHERE id=$2`, *body.ProductDescription, id)
				if err != nil { http.Error(w, err.Error(), 500); return }
			}
			json.NewEncoder(w).Encode(map[string]bool{"success": true})
			return
		}

		// admin can edit everything
		if body.RequesterName != nil {
			db.Exec(`UPDATE orders SET requester_name=$1 WHERE id=$2`, *body.RequesterName, id)
		}
		if body.ProjectName != nil {
			db.Exec(`UPDATE orders SET project_name=$1 WHERE id=$2`, *body.ProjectName, id)
		}
		if body.CompanyName != nil {
			db.Exec(`UPDATE orders SET company_name=$1 WHERE id=$2`, *body.CompanyName, id)
		}
		if body.ProductName != nil {
			db.Exec(`UPDATE orders SET product_name=$1 WHERE id=$2`, *body.ProductName, id)
		}
		if body.ProductURL != nil {
			db.Exec(`UPDATE orders SET product_url=$1 WHERE id=$2`, *body.ProductURL, id)
		}
		if body.ProductDescription != nil {
			db.Exec(`UPDATE orders SET product_description=$1 WHERE id=$2`, *body.ProductDescription, id)
		}
		if body.Quantity != nil {
			db.Exec(`UPDATE orders SET quantity=$1 WHERE id=$2`, *body.Quantity, id)
		}
		if body.NeededByDate != nil {
			db.Exec(`UPDATE orders SET needed_by_date=$1 WHERE id=$2`, parseDMY(*body.NeededByDate), id)
		}
		if body.TrackingURL != nil {
			db.Exec(`UPDATE orders SET tracking_url=$1 WHERE id=$2`, *body.TrackingURL, id)
		}
		if body.OrderStatus != nil {
			db.Exec(`UPDATE orders SET order_status=$1 WHERE id=$2`, *body.OrderStatus, id)
		}
		if body.PaymentStatus != nil {
			db.Exec(`UPDATE orders SET payment_status=$1 WHERE id=$2`, *body.PaymentStatus, id)
		}
		if body.DeliveryDate != nil {
			db.Exec(`UPDATE orders SET delivery_date=$1 WHERE id=$2`, parseDMY(*body.DeliveryDate), id)
		}
		if body.Notes != nil {
			db.Exec(`UPDATE orders SET notes=$1 WHERE id=$2`, *body.Notes, id)
		}
		if body.InvoiceFilename != nil {
			db.Exec(`UPDATE orders SET invoice_filename=$1 WHERE id=$2`, *body.InvoiceFilename, id)
		}
		if body.InvoiceData != nil {
			db.Exec(`UPDATE orders SET invoice_data=$1 WHERE id=$2`, *body.InvoiceData, id)
		}
		json.NewEncoder(w).Encode(map[string]bool{"success": true})

	case "DELETE":
		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
		if r.URL.Query().Get("permanent") == "true" {
			if user.Role != "admin" {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			_, err := db.Exec(`DELETE FROM orders WHERE id=$1`, id)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			json.NewEncoder(w).Encode(map[string]bool{"success": true})
			return
		}
		if user.Role != "admin" {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		_, err := db.Exec(`UPDATE orders SET archived=TRUE WHERE id=$1`, id)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"success": true})

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func parseDMY(s string) interface{} {
	t, err := time.Parse("02/01/2006", s)
	if err != nil {
		return nil
	}
	return t.Format("2006-01-02")
}

func ensureSchema() error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS orders (
		id SERIAL PRIMARY KEY,
		requester_name TEXT NOT NULL,
		project_name TEXT DEFAULT '',
		company_name TEXT DEFAULT '',
		product_name TEXT NOT NULL,
		product_url TEXT,
		product_description TEXT,
		quantity INTEGER NOT NULL DEFAULT 1,
		order_date DATE NOT NULL DEFAULT CURRENT_DATE,
		needed_by_date DATE,
		delivery_date DATE,
		tracking_url TEXT DEFAULT '',
		order_status TEXT NOT NULL DEFAULT 'Pending',
		payment_status TEXT NOT NULL DEFAULT 'Unpaid',
		notes TEXT DEFAULT '',
		invoice_filename TEXT DEFAULT '',
		invoice_data TEXT DEFAULT '',
		archived BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP NOT NULL DEFAULT NOW()
	)`)
	if err != nil {
		return err
	}
	migrations := []string{
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT ''`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT ''`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_filename TEXT DEFAULT ''`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_data TEXT DEFAULT ''`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE`,
	}
	for _, q := range migrations {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5432/purchasehub?sslmode=disable"
	}
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB connection failed: ", err)
	}
	if err = ensureSchema(); err != nil {
		log.Fatal("DB schema setup failed: ", err)
	}

	http.HandleFunc("/api/login", loginHandler)
	http.HandleFunc("/api/orders", ordersHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("PurchaseHub backend running on port " + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
