package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGT1Result struct {
	A bool
}

func (mrTable *PostAGType) T1(mrQueryable mingru.Queryable, id uint64) (PostAGT1Result, error) {
	var result PostAGT1Result
	err := mrQueryable.QueryRow("SELECT EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostAGT2Result struct {
	A int
}

func (mrTable *PostAGType) T2(mrQueryable mingru.Queryable, id uint64) (PostAGT2Result, error) {
	var result PostAGT2Result
	err := mrQueryable.QueryRow("SELECT IF(EXISTS(SELECT `join_1`.`sig` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `db_post`.`id` = ?), 1, 2) AS `a` FROM `db_post`", id).Scan(&result.A)
	if err != nil {
		return result, err
	}
	return result, nil
}
