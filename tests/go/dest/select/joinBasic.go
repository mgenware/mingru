package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	Title       string
	UserUrlName string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name`, `db_post`.`title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.UserUrlName, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
