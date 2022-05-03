package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) DeleteByID(mrQueryable mingru.Queryable, postTp mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(postTp)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type PostAGSelectPostInfoResult struct {
	Content     string
	ID          uint64
	UserUrlName string
}

func (mrTable *PostAGType) SelectPostInfo(mrQueryable mingru.Queryable, postTp mingru.Table) (PostAGSelectPostInfoResult, error) {
	var result PostAGSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `post_tp`.`id`, `post_tp`.`content`, `join_1`.`url_name` FROM "+string(postTp)+" AS `post_tp` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_tp`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) UpdateContent(mrQueryable mingru.Queryable, postTp mingru.Table, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+string(postTp)+" SET `content` = `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
