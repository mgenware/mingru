package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

func (mrTable *TableTypePost) DeleteByID(mrQueryable mingru.Queryable, mrFromTable string, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type PostTableSelectPostInfoResult struct {
	Content     string
	ID          uint64
	UserUrlName string
}

func (mrTable *TableTypePost) SelectPostInfo(mrQueryable mingru.Queryable, mrFromTable string) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`content`, `join_1`.`url_name` FROM "+mrFromTable+" AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *TableTypePost) UpdateContent(mrQueryable mingru.Queryable, mrFromTable string, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable+" SET `content` = `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
