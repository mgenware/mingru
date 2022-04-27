package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (string, error) {
	var result string
	err := mrQueryable.QueryRow("SELECT `title` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
