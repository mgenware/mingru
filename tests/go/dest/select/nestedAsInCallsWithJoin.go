package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGTResult struct {
	Name1 int
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, ageInput int) (PostAGTResult, error) {
	var result PostAGTResult
	err := mrQueryable.QueryRow("SELECT YEAR(YEAR(`join_1`.`age`)) AS `name1` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE YEAR(YEAR(`join_1`.`age`)) == ?", ageInput).Scan(&result.Name1)
	if err != nil {
		return result, err
	}
	return result, nil
}
