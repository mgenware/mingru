package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) SelectByID(mrQueryable mingru.Queryable, id uint64) (Res1, error) {
	var result Res1
	err := mrQueryable.QueryRow("SELECT `id` FROM `db_post` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostTableSelectPostInfoResult struct {
	Content     string
	UserUrlName string
}

func (mrTable *TableTypePost) SelectPostInfo(mrQueryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`content`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *TableTypePost) SelectTime(mrQueryable mingru.Queryable) (Res3, error) {
	var result Res3
	err := mrQueryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result.NDatetime)
	if err != nil {
		return result, err
	}
	return result, nil
}