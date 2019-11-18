package da

import (
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// SelectByID ...
func (da *TableTypePost) SelectByID(queryable dbx.Queryable, id uint64) (*Res1, error) {
	result := &Res1{}
	err := queryable.QueryRow("SELECT `id` FROM `db_post` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	NDatetime   *time.Time
	UserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error) {
	result := &PostTableSelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `db_post`.`n_datetime` AS `nDatetime`, `join_1`.`url_name` AS `userUrlName` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.NDatetime, &result.UserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectTime ...
func (da *TableTypePost) SelectTime(queryable dbx.Queryable) (*Res3, error) {
	result := &Res3{}
	err := queryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result.NDatetime)
	if err != nil {
		return nil, err
	}
	return result, nil
}
