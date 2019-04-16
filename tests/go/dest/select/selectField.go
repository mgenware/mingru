import "github.com/mgenware/go-packagex/v5/dbx"

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `title` FROM `post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
