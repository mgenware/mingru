import "github.com/mgenware/go-packagex/dbx"

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `title` FROM `post`").Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
