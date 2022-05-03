package da

import "github.com/mgenware/mingru-go-lib"

type RplAGType struct {
}

var Rpl = &RplAGType{}

// ------------ Actions ------------

type RplAGSelectTResult struct {
	A int `json:"a"`
	B int `json:"-"`
}

func (mrTable *RplAGType) SelectT(mrQueryable mingru.Queryable) (RplAGSelectTResult, error) {
	var result RplAGSelectTResult
	err := mrQueryable.QueryRow("SELECT 1 AS `a`, 1 AS `b` FROM `post_cmt_rpl`").Scan(&result.A, &result.B)
	if err != nil {
		return result, err
	}
	return result, nil
}
