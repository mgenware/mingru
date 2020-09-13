package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePostCmt ...
type TableTypePostCmt struct {
}

// PostCmt ...
var PostCmt = &TableTypePostCmt{}

// ------------ Actions ------------

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	ID uint64
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable mingru.Queryable, targetUserUrlName string) (*PostCmtTableSelectTResult, error) {
	result := &PostCmtTableSelectTResult{}
	err := queryable.QueryRow("SELECT `post_cmt`.`id` AS `id` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `join_2`.`url_name` = ?", targetUserUrlName).Scan(&result.ID)
	if err != nil {
		return nil, err
	}
	return result, nil
}
