package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateT(mrQueryable mingru.Queryable, id uint64, content string) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", content, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
