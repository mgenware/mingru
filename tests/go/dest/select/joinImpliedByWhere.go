package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePostCmt struct {
}

var PostCmt = &TableTypePostCmt{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePostCmt) MingruSQLName() string {
	return "post_cmt"
}

// ------------ Actions ------------

type PostCmtTableSelectTResult struct {
	ID uint64
}

func (mrTable *TableTypePostCmt) SelectT(mrQueryable mingru.Queryable, targetUserUrlName string) (PostCmtTableSelectTResult, error) {
	var result PostCmtTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `post_cmt`.`id` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `join_2`.`url_name` = ?", targetUserUrlName).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
