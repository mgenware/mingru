import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	PostCmtID                uint64
	A                        uint64
	B                        string
	PostCmtTargetUserUrlName string
	C                        string
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `_main`.`id` AS `postCmtID`, `_main`.`user_id` AS `a`, `_join_1`.`title` AS `b`, `_join_2`.`url_name` AS `postCmtTargetUserUrlName`, `_join_2`.`url_name` AS `c` FROM `post_cmt` AS `_main` INNER JOIN `post` AS `_join_1` ON `_join_1`.`id` = `_main`.`target_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`user_id`").Scan(&result.PostCmtID, &result.A, &result.B, &result.PostCmtTargetUserUrlName, &result.C)
	if err != nil {
		return nil, err
	}
	return result, nil
}

