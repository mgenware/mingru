package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	UserUrlName string
	Title       string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `join_1`.`url_name` AS `userUrlName`, `db_post`.`title` AS `title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `join_1`.`sig`-`db_post`.`user_id` ORDER BY `join_1`.`sig`, `db_post`.`user_id` DESC")
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
		err = rows.Scan(&item.UserUrlName, &item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}