package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	TitleAge int
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`age` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`url_name` = `db_post`.`title` AND `join_1`.`user_id` = `db_post`.`id` AND `join_1`.`my_user_id` = `db_post`.`id`").Scan(&result.TitleAge)
	if err != nil {
		return result, err
	}
	return result, nil
}
