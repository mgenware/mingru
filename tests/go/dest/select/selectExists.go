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

// T ...
func (da *TableTypePost) T(queryable dbx.Queryable, userSig *string) (bool, error) {
	var result bool
	err := queryable.QueryRow("SELECT EXISTS(SELECT * FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `join_1`.`sig` = ?)", userSig).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
