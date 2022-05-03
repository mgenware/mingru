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

type PostAGSelectPostInfoResult struct {
	ID          uint64
	Title       string
	UserID      uint64
	UserUrlName string
}

func (mrTable *PostAGType) SelectPostInfo(mrQueryable mingru.Queryable) (PostAGSelectPostInfoResult, error) {
	var result PostAGSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`title`, `db_post`.`user_id`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Title, &result.UserID, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostAGSelectPostTitleResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) SelectPostTitle(mrQueryable mingru.Queryable) (PostAGSelectPostTitleResult, error) {
	var result PostAGSelectPostTitleResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) UpdatePostTitle(mrQueryable mingru.Queryable, title string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ?", title)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
