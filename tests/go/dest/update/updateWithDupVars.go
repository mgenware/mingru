package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateT(mrQueryable mingru.Queryable, title string, content string, content2 string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\" WHERE (`title` = ? AND `content` = ?)", content2, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
