package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePostReply struct {
}

var PostReply = &TableTypePostReply{}

// ------------ Actions ------------

type PostReplyTableSelectTResult struct {
	A int `json:"a"`
	B int `json:"-"`
}

func (mrTable *TableTypePostReply) SelectT(mrQueryable mingru.Queryable) (PostReplyTableSelectTResult, error) {
	var result PostReplyTableSelectTResult
	err := mrQueryable.QueryRow("SELECT 1 AS `a`, 1 AS `b` FROM `post_cmt_rpl`").Scan(&result.A, &result.B)
	if err != nil {
		return result, err
	}
	return result, nil
}
