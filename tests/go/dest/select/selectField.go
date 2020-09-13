package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `title` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
