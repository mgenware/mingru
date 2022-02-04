package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) (string, error) {
	var result string
	err := mrQueryable.QueryRow("SELECT `title` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
