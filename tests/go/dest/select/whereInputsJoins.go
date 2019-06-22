package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePostCmt ...
type TableTypePostCmt struct {
}

// PostCmt ...
var PostCmt = &TableTypePostCmt{}

// ------------ Actions ------------

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	ID uint64
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable dbx.Queryable, id uint64, userID uint64, targetTitle string, targetUserUrlName string) (*PostCmtTableSelectTResult, error) {
	result := &PostCmtTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id` FROM `post_cmt` WHERE  ?, ?, ?, ?", id, userID, targetTitle, targetUserUrlName).Scan(&result.ID)
	if err != nil {
		return nil, err
	}
	return result, nil
}
