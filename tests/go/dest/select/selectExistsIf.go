package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableT1Result ...
type PostTableT1Result struct {
	A bool
}

// T1 ...
func (da *TableTypePost) T1(queryable mingru.Queryable) (*PostTableT1Result, error) {
	result := &PostTableT1Result{}
	err := queryable.QueryRow("SELECT EXISTS(SELECT `join_1`.`sig` AS `userSig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`) AS `a` FROM `db_post`").Scan(&result.A)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// PostTableT2Result ...
type PostTableT2Result struct {
	A int
}

// T2 ...
func (da *TableTypePost) T2(queryable mingru.Queryable) (*PostTableT2Result, error) {
	result := &PostTableT2Result{}
	err := queryable.QueryRow("SELECT IF(EXISTS(SELECT `join_1`.`sig` AS `userSig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`), 1, 2) AS `a` FROM `db_post`").Scan(&result.A)
	if err != nil {
		return nil, err
	}
	return result, nil
}
