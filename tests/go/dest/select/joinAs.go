import "github.com/mgenware/go-packagex/dbx"

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	PostCmtID                uint64
	A                        uint64
	B                        string
	PostCmtTargetUserUrlName string
	C                        string
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable dbx.Queryable) (*PostCmtTableSelectTResult, error) {
	result := &PostCmtTableSelectTResult{}
	err := queryable.QueryRow("SELECT `post_cmt`.`id` AS `postCmtID`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `postCmtTargetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `postCmtTarget`.`user_id`").Scan(&result.PostCmtID, &result.A, &result.B, &result.PostCmtTargetUserUrlName, &result.C)
	if err != nil {
		return nil, err
	}
	return result, nil
}
