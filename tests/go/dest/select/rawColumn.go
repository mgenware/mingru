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
	A         int64
	B         int16
	C         int
	SnakeName string
	NDatetime int
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT raw expr AS `a`, xyz(`db_post`.`n_date`) AS `b`, xyz(`join_1`.`display_name`) AS `c`, `join_1`.`display_name` AS `snake_name`, COUNT(`n_datetime`) AS `nDatetime` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.A, &result.B, &result.C, &result.SnakeName, &result.NDatetime)
	if err != nil {
		return nil, err
	}
	return result, nil
}
