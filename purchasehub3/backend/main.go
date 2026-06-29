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
	json.NewDecoder(r.Body).Decode(&creds)
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
	user, ok := getSession(r)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case "GET":
		rows, err := db.Query(`SELECT id, requester_name, project_name, product_name, product_url, product_description, quantity,
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
			rows.Scan(&o.ID, &o.RequesterName, &o.ProjectName, &o.ProductName, &o.ProductURL, &o.ProductDescription, &o.Quantity,
				&o.OrderDate, &o.NeededByDate, &o.DeliveryDate, &o.TrackingURL, &o.OrderStatus, &o.PaymentStatus, &o.Notes,
				&o.InvoiceFilename, &o.InvoiceData, &o.Archived)
			list = append(list, o)
		}
		if list == nil {
			list = []Order{}
		}
		json.NewEncoder(w).Encode(list)

	case "POST":
		var o Order
		json.NewDecoder(r.Body).Decode(&o)
		if o.Quantity < 1 {
			o.Quantity = 1
		}
		var neededBy interface{}
		if o.NeededByDate != "" {
			neededBy = parseDMY(o.NeededByDate)
		} else {
			neededBy = nil
		}
		var id int
		err := db.QueryRow(`INSERT INTO orders
			(requester_name, project_name, product_name, product_url, product_description, quantity, needed_by_date, order_status, payment_status, notes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending','Unpaid','') RETURNING id`,
			o.RequesterName, o.ProjectName, o.ProductName, o.ProductURL, o.ProductDescription, o.Quantity, neededBy).Scan(&id)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": id})

	case "PUT":
		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
		var body struct {
			RequesterName      *string `json:"requester_name"`
			ProjectName        *string `json:"project_name"`
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
		json.NewDecoder(r.Body).Decode(&body)

		if user.Role != "admin" {
			// employee can only edit notes
			if body.Notes != nil {
				_, err := db.Exec(`UPDATE orders SET notes=$1 WHERE id=$2`, *body.Notes, id)
				if err != nil {
					http.Error(w, err.Error(), 500)
					return
				}
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
		if user.Role != "admin" {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
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

	http.HandleFunc("/api/login", loginHandler)
	http.HandleFunc("/api/orders", ordersHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("PurchaseHub backend running on port " + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
