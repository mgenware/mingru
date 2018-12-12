import "github.com/mgenware/go-packagex/database/sqlx"

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `title` FROM `post`").Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
