import (
	"time"

	"github.com/mgenware/go-packagex/database/sqlx"
)

// SelectTResult ...
type SelectTResult struct {
	A     int64
	B     time.Time
	C     int
	D     *time.Time
	E     string
	Count int
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT raw expr AS `a`, xyz(`_main`.`n_date`) AS `b`, xyz(`_join_1`.`display_name`) AS `c`, `_main`.`n_date` AS `d`, `_join_1`.`display_name` AS `e`, COUNT(`datetime`) AS `count` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`").Scan(&result.A, &result.B, &result.C, &result.D, &result.E, &result.Count)
	if err != nil {
		return nil, err
	}
	return result, nil
}
