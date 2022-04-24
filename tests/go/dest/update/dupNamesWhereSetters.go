package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateT(mrQueryable mingru.Queryable, title string, content string, mUserID uint64) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\", `my_user_id` = ? WHERE `title` = ? `title` = ? AND `content` = ?", content, mUserID, title, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
