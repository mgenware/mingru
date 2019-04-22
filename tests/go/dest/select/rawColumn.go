import "github.com/mgenware/go-packagex/v5/dbx"

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
	err := queryable.QueryRow("SELECT raw expr AS `a`, xyz(`post`.`n_date`) AS `b`, xyz(`join_1`.`display_name`) AS `c`, `join_1`.`display_name` AS `snake_name`, COUNT(`n_datetime`) AS `n_datetime` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.A, &result.B, &result.C, &result.SnakeName, &result.NDatetime)
	if err != nil {
		return nil, err
	}
	return result, nil
}
