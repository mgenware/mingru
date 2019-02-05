import "github.com/mgenware/go-packagex/dbx"

// SelectTResult ...
type SelectTResult struct {
	A         int64
	B         int16
	C         int
	SnakeName string
	NDatetime int
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT raw expr AS `a`, xyz(`_main`.`n_date`) AS `b`, xyz(`_join_1`.`display_name`) AS `c`, `_join_1`.`display_name` AS `snake_name`, COUNT(`n_datetime`) AS `n_datetime` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`").Scan(&result.A, &result.B, &result.C, &result.SnakeName, &result.NDatetime)
	if err != nil {
		return nil, err
	}
	return result, nil
}
