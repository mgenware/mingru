package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// T ...
func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, userSig *string) (bool, error) {
	var result bool
	err := mrQueryable.QueryRow("SELECT EXISTS(SELECT * FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `join_1`.`sig` = ?)", userSig).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
