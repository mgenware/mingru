package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	CmtCount           uint
	MUserID            uint64
	A                  uint64
	MUserFollowerCount *string
	Fc                 *string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `db_post`.`cmt_c` AS `cmtCount`, `db_post`.`my_user_id` AS `mUserID`, `db_post`.`my_user_id` AS `a`, `join_1`.`follower_c` AS `mUserFollowerCount`, `join_1`.`follower_c` AS `fc` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`my_user_id`").Scan(&result.CmtCount, &result.MUserID, &result.A, &result.MUserFollowerCount, &result.Fc)
	if err != nil {
		return nil, err
	}
	return result, nil
}
