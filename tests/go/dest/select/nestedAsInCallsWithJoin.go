package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

type PostTableTResult struct {
	Name1 int
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, ageInput int) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT YEAR(YEAR(`join_1`.`age`)) AS `name1` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE YEAR(YEAR(`join_1`.`age`)) == ?", ageInput).Scan(&result.Name1)
	if err != nil {
		return result, err
	}
	return result, nil
}
