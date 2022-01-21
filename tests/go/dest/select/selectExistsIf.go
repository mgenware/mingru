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

// PostTableT1Result ...
type PostTableT1Result struct {
	A bool
}

// T1 ...
func (mrTable *TableTypePost) T1(queryable mingru.Queryable, id uint64) (PostTableT1Result, error) {
	var result PostTableT1Result
	err := queryable.QueryRow("SELECT EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}

// PostTableT2Result ...
type PostTableT2Result struct {
	A int
}

// T2 ...
func (mrTable *TableTypePost) T2(queryable mingru.Queryable, id uint64) (PostTableT2Result, error) {
	var result PostTableT2Result
	err := queryable.QueryRow("SELECT IF(EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?), 1, 2) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}
