package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePostCmt ...
type TableTypePostCmt struct {
}

// PostCmt ...
var PostCmt = &TableTypePostCmt{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePostCmt) MingruSQLName() string {
	return "post_cmt"
}

// ------------ Actions ------------

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	ID uint64
}

// SelectT ...
func (mrTable *TableTypePostCmt) SelectT(queryable mingru.Queryable, id uint64, userID uint64, targetTitle string, targetUserUrlName string) (PostCmtTableSelectTResult, error) {
	var result PostCmtTableSelectTResult
	err := queryable.QueryRow("SELECT `id` FROM `post_cmt` WHERE  ?, ?, ?, ?", id, userID, targetTitle, targetUserUrlName).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
