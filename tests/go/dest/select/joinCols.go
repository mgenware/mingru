import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	PostCmtRplUserUrlName   string
	PostCmtRplUserID        uint64
	PostCmtRplToUserUrlName string
}

// SelectT ...
func (da *TableTypePostCmtRpl) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `_join_1`.`url_name` AS `postCmtRplUserUrlName`, `_join_1`.`id` AS `postCmtRplUserID`, `_join_2`.`url_name` AS `postCmtRplToUserUrlName` FROM `post_cmt_rpl` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`to_user_id`").Scan(&result.PostCmtRplUserUrlName, &result.PostCmtRplUserID, &result.PostCmtRplToUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
