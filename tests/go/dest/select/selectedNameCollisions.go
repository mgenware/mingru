import "github.com/mgenware/go-packagex/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	PostTitle        string
	PostTitle2       string
	A                string
	PostTitle3       string
	A                string
	A                uint64
	PostUserUrlName  string
	PostUserUrlName2 string
	A                string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `post`.`title` AS `postTitle`, `post`.`title` AS `postTitle2`, `post`.`title` AS `a`, `post`.`title` AS `postTitle3`, `post`.`title` AS `a`, `post`.`user_id` AS `a`, `join_1`.`url_name` AS `postUserUrlName`, `join_1`.`url_name` AS `postUserUrlName2`, `join_1`.`url_name` AS `a` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.PostTitle, &result.PostTitle2, &result.A, &result.PostTitle3, &result.A, &result.A, &result.PostUserUrlName, &result.PostUserUrlName2, &result.A)
	if err != nil {
		return nil, err
	}
	return result, nil
}
