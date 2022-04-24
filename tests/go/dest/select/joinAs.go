package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePostCmt struct {
}

var PostCmt = &TableTypePostCmt{}

// ------------ Actions ------------

type PostCmtTableSelectTResult struct {
	A                 uint64
	B                 string
	C                 string
	ID                uint64
	TargetUserUrlName string
}

func (mrTable *TableTypePostCmt) SelectT(mrQueryable mingru.Queryable) (PostCmtTableSelectTResult, error) {
	var result PostCmtTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `post_cmt`.`id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id`").Scan(&result.ID, &result.A, &result.B, &result.TargetUserUrlName, &result.C)
	if err != nil {
		return result, err
	}
	return result, nil
}
