package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	Name1 int
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable, ageInput int) (*PostTableTResult, error) {
	result := &PostTableTResult{}
	err := queryable.QueryRow("SELECT YEAR(YEAR(`join_1`.`age`)) AS `name1` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE YEAR(YEAR(`join_1`.`age`)) == ?", ageInput).Scan(&result.Name1)
	if err != nil {
		return nil, err
	}
	return result, nil
}
