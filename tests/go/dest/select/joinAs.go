import "github.com/mgenware/go-packagex/dbx"

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	ID                uint64
	A                 uint64
	B                 string
	TargetUserUrlName string
	C                 string
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable dbx.Queryable) (*PostCmtTableSelectTResult, error) {
	result := &PostCmtTableSelectTResult{}
	err := queryable.QueryRow("SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`").Scan(&result.ID, &result.A, &result.B, &result.TargetUserUrlName, &result.C)
	if err != nil {
		return nil, err
	}
	return result, nil
}
