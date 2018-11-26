package da

import (
	"database/sql"

	_ "github.com/go-sql-driver/mysql"
)

const DSN = "root:123456@tcp(localhost:3306)/t_cf?parseTime=true&collation=utf8mb4_unicode_ci"

func GetConn() (*sql.DB, error) {
	conn, err := sql.Open("mysql", DSN)
	if err != nil {
		return nil, err
	}
	return conn, nil
}
