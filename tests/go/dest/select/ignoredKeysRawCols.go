package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePostReply ...
type TableTypePostReply struct {
}

// PostReply ...
var PostReply = &TableTypePostReply{}

// ------------ Actions ------------

// PostReplyTableSelectTResult ...
type PostReplyTableSelectTResult struct {
	A int `json:"a"`
	B int `json:"-"`
}

// SelectT ...
func (da *TableTypePostReply) SelectT(queryable dbx.Queryable) (*PostReplyTableSelectTResult, error) {
	result := &PostReplyTableSelectTResult{}
	err := queryable.QueryRow("SELECT 1 AS `a`, 1 AS `b` FROM `post_cmt_rpl`").Scan(&result.A, &result.B)
	if err != nil {
		return nil, err
	}
	return result, nil
}