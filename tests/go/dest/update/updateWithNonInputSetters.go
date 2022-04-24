package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateT(mrQueryable mingru.Queryable, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
