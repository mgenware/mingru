package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) DeleteByID(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type PostTableSelectPostInfoResult struct {
	Content     string
	ID          uint64
	UserUrlName string
}

func (mrTable *PostAGType) SelectPostInfo(mrQueryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`content`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) UpdateContent(mrQueryable mingru.Queryable, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
