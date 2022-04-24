package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableTResult struct {
	NTime *time.Time
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, userID uint64) ([]PostTableTResult, error) {
	rows, err := mrQueryable.Query("SELECT `db_post`.`n_time` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` ORDER BY `db_post`.`user_id` GROUP BY `title` HAVING `join_1`.`id` = ?", userID)
	if err != nil {
		return nil, err
	}
	var result []PostTableTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableTResult
		err = rows.Scan(&item.NTime)
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
