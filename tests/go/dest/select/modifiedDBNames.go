package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	A                  uint64
	CmtCount           uint
	Fc                 *string
	MUserFollowerCount *string
	MUserID            uint64
}

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`cmt_c`, `db_post`.`my_user_id`, `db_post`.`my_user_id` AS `a`, `join_1`.`follower_c`, `join_1`.`follower_c` AS `fc` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`my_user_id`").Scan(&result.CmtCount, &result.MUserID, &result.A, &result.MUserFollowerCount, &result.Fc)
	if err != nil {
		return result, err
	}
	return result, nil
}
