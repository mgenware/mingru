package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) DeleteByID(mrQueryable mingru.Queryable, confTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(confTable)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type ConfTableTableSelectPostInfoResult struct {
	ID          uint64
	Title       string
	UserID      uint64
	UserUrlName string
}

func (mrTable *PostAGType) SelectPostInfo(mrQueryable mingru.Queryable, confTable mingru.Table) (ConfTableTableSelectPostInfoResult, error) {
	var result ConfTableTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `conf_table`.`id`, `conf_table`.`title`, `conf_table`.`user_id`, `join_1`.`url_name` FROM "+string(confTable)+" AS `conf_table` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `conf_table`.`user_id`").Scan(&result.ID, &result.Title, &result.UserID, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

type ConfTableTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) SelectPostTitle(mrQueryable mingru.Queryable, confTable mingru.Table) (ConfTableTableSelectPostTitleResult, error) {
	var result ConfTableTableSelectPostTitleResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM "+string(confTable)).Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) UpdatePostTitle(mrQueryable mingru.Queryable, confTable mingru.Table, title string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+string(confTable)+" SET `title` = ?", title)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
