package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

type PostTableT1Result struct {
	A bool
}

func (mrTable *PostAGType) T1(mrQueryable mingru.Queryable, id uint64) (PostTableT1Result, error) {
	var result PostTableT1Result
	err := mrQueryable.QueryRow("SELECT EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostTableT2Result struct {
	A int
}

func (mrTable *PostAGType) T2(mrQueryable mingru.Queryable, id uint64) (PostTableT2Result, error) {
	var result PostTableT2Result
	err := mrQueryable.QueryRow("SELECT IF(EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?), 1, 2) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}
