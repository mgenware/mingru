import "github.com/mgenware/go-packagex/v5/dbx"

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
	err := queryable.QueryRow("SELECT `post`.`cmt_c` AS `cmtCount`, `post`.`my_user_id` AS `mUserID`, `post`.`my_user_id` AS `a`, `join_1`.`follower_c` AS `mUserFollowerCount`, `join_1`.`follower_c` AS `fc` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`my_user_id`").Scan(&result.CmtCount, &result.MUserID, &result.A, &result.MUserFollowerCount, &result.Fc)
	if err != nil {
		return nil, err
	}
	return result, nil
}
